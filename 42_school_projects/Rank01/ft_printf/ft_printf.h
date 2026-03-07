/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_printf.h                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/14 12:26:56 by lraghave          #+#    #+#             */
/*   Updated: 2025/07/16 13:51:37 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#ifndef FT_PRINTF_H
# define FT_PRINTF_H

# include <unistd.h>
# include <stdarg.h>

int		ft_format_check(const char c);
int		ft_putnbr_fd_mod(int i, int fd);
int		ft_putchar_fd_mod(char c, int fd);
int		ft_putstr_fd_mod(char *c, int fd);
int		ft_printf(const char *format, ...);
int		ft_putadd_fd_mod(void *ptr, int fd);
int		ft_putnbru_fd_mod(unsigned int i, int fd);
int		ft_puthexl_fd_mod(unsigned int i, int fd);
int		ft_puthexu_fd_mod(unsigned int i, int fd);
void	ft_type(char c, int *bytes_printed, va_list args);

#endif
