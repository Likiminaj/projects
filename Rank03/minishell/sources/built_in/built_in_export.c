/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   built_in_export.c                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/18 17:01:47 by chlpesty          #+#    #+#             */
/*   Updated: 2026/02/04 14:46:33 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		builtin_export(t_ast *ast, t_env *env);
void	print_export(t_env *env);
void	print_export_with_content(char *var_name, char *env_line);
int		exec_export(t_env *env, char *var_name, char *content);
int		varname_is_valid(char *var_name);

/* Creates new variable(s) in envp */
int	builtin_export(t_ast *ast, t_env *env)
{
	int		i;
	int		err;
	char	*var_name;
	char	*content;

	i = 1;
	err = 0;
	if (ast->args[1] == NULL)
		return (print_export(env), 0);
	while (ast->args[i] != NULL)
	{
		var_name = var_name_export(ast->args[i]);
		if (!var_name)
			return (1);
		content = NULL;
		if (equal_found(ast->args[i]) == 1)
		{
			content = find_content(ast->args[i]);
			if (!content)
				return (free(var_name), 1);
		}
		err += exec_export(env, var_name, content);
		i++;
	}
	return (err != 0);
}

/* If after export nothing is provided by the user, it prints
all the existing variables. */
void	print_export(t_env *env)
{
	int		i;
	char	*var_name;
	char	**sorted_envp;

	if (!env || !env->envp)
		return ;
	sorted_envp = copy_envp(env->envp); // TO DO
	if (!sorted_envp)
		return ;
	bubble_sort_envp(sorted_envp); // TO DO
	i = 0;
	while (sorted_envp[i] != NULL)
	{
		var_name = var_name_export(sorted_envp[i]);
		if (!var_name)
			return (free(sorted_envp));
		if (equal_found(sorted_envp[i]) == 1)
			print_export_with_content(var_name, sorted_envp[i]);
		else
			ft_printf("declare -x %s\n", var_name);
		free(var_name);
		i++;
	}
	free(sorted_envp);
}

/* Function dedicated to print on screen variables with content. 
", ', $ and \ are escaped with \ to be showned as literal chars.*/
void	print_export_with_content(char *var_name, char *env_line)
{
	char	*content;
	char	*corrected_content;

	content = find_content(env_line);
	if (!content)
		return (free(var_name));
	corrected_content = escaped_quotes(content);
	if (!corrected_content)
		return (free(var_name), free(content));
	ft_printf("declare -x %s=\"%s\"\n", var_name, corrected_content);
	free(content);
	free(corrected_content);
}

/* If the choosen variable name is valid, it creates or update it,
else, it returns an error massage. */
int	exec_export(t_env *env, char *var_name, char *content)
{
	int	err;

	err = 0;
	if (varname_is_valid(var_name) == 1)
		update_var(env, var_name, content);
	else
	{
		ft_putstr_fd("minishell: export: `", 2);
		ft_putstr_fd(var_name, 2);
		ft_putstr_fd("': not a valid identifier\n", 2);
		err = 1;
	}
	free(var_name);
	if (content)
		free(content);
	return (err);
}

/* Check is the variable name is valid, meaning it starts with a letter or _
and doesn't contain signs. Follows Bash guidelines. */
int	varname_is_valid(char *var_name)
{
	int	i;

	if (!var_name || var_name[0] == '\0')
		return (0);
	if (!(((var_name[0] >= 'a') && (var_name[0] <= 'z'))
			|| ((var_name[0] >= 'A') && (var_name[0] <= 'Z'))
			|| var_name[0] == '_'))
		return (0);
	i = 1;
	while (var_name[i] != '\0')
	{
		if (!(((var_name[i] >= 'a') && (var_name[i] <= 'z'))
				|| ((var_name[i] >= 'A') && (var_name[i] <= 'Z'))
				|| (var_name[i] == '_')
				|| ((var_name[i] >= '0') && (var_name[i] <= '9'))))
			return (0);
		i++;
	}
	return (1);
}
