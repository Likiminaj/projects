/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   built_in_cd.c                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/01/18 17:00:21 by chlpesty          #+#    #+#             */
/*   Updated: 2026/02/02 02:43:06 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		builtin_cd(t_ast *ast, t_env *env);
int		cd_home(t_env *env);
int		exec_cd(t_env *env, char *path);

/* Changes current working directory */
int	builtin_cd(t_ast *ast, t_env *env)
{
	char	*new_cwd;

	if (ast->args[1] == NULL)
		return (cd_home(env));
	if (ast->args[2] != NULL)
		return (ft_putstr_fd("minishell: cd: too many arguments\n", 2), 1);
	if (exec_cd(env, ast->args[1]) != 0)
		return (1);
	new_cwd = getcwd(NULL, 0);
	if (new_cwd)
	{
		update_var(env, "PWD", new_cwd);
		free (new_cwd);
	}
	return (0);
}

/* Handles edge case cd + no argument -> should go back $HOME */
int	cd_home(t_env *env)
{
	int		index;
	char	*cwd;
	char	*new_cwd;

	index = find_index_in_env(env->envp, "HOME");
	if (index == -1)
		return (ft_putstr_fd("minishell: cd: HOME not set\n", 2), 1);
	else
	{
		cwd = find_content(env->envp[index]);
		if (!cwd)
			return (1);
		if (exec_cd(env, cwd) != 0)
			return (free(cwd), 1);
		free(cwd);
		new_cwd = getcwd(NULL, 0);
		if (new_cwd)
		{
			update_var(env, "PWD", new_cwd);
			free (new_cwd);
		}
	}
	return (0);
}

int	exec_cd(t_env *env, char *path)
{
	int		index_pwd;
	char	*old_pwd;

	index_pwd = find_index_in_env(env->envp, "PWD");
	if (index_pwd == -1)
		old_pwd = NULL;
	else
		old_pwd = find_content(env->envp[index_pwd]);
	if (chdir(path) != 0)
	{
		ft_putstr_fd("minishell: cd: ", 2);
		perror(path);
		if (old_pwd)
			free(old_pwd);
		return (1);
	}
	if (old_pwd)
	{
		update_var(env, "OLDPWD", old_pwd);
		free (old_pwd);
	}
	return (0);
}
